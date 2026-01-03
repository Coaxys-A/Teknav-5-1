import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ArticlesService } from './articles.service';
import { Article } from './entities/article.entity';
import { CreateArticleInput } from './entities/create-article.input';
import { UpdateArticleInput } from './entities/update-article.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Resolver(() => Article)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ArticlesResolver {
  constructor(private readonly articlesService: ArticlesService) {}

  @Query(() => [Article])
  @Roles(Role.WRITER)
  async myArticles(@CurrentUser() user: any, @Args('status', { nullable: true }) status?: string) {
    return this.articlesService.listForUser(user, status);
  }

  @Query(() => [Article])
  async publicArticles(@Args('status', { nullable: true }) status?: string) {
    return this.articlesService.findPublic(status ?? 'PUBLISH');
  }

  @Mutation(() => Article)
  @Roles(Role.WRITER)
  async createArticle(@Args('input') input: CreateArticleInput, @CurrentUser() user: any) {
    return this.articlesService.create(input, user);
  }

  @Mutation(() => Article)
  @Roles(Role.WRITER)
  async updateArticle(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateArticleInput,
    @CurrentUser() user: any,
  ) {
    return this.articlesService.update(id, input, user);
  }

  @Mutation(() => Article)
  @Roles(Role.ADMIN)
  async approveArticle(@Args('id', { type: () => Int }) id: number, @CurrentUser() user: any) {
    return this.articlesService.approve(id, user);
  }

  @Mutation(() => Article)
  @Roles(Role.ADMIN)
  async rejectArticle(
    @Args('id', { type: () => Int }) id: number,
    @Args('reason', { nullable: true }) reason: string,
    @CurrentUser() user: any,
  ) {
    return this.articlesService.reject(id, reason, user);
  }
}
