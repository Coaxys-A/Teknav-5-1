import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './entities/create-user.input';
import { UpdateUserInput } from './entities/update-user.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Resolver(() => User)
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User])
  @Roles(Role.ADMIN)
  async users() {
    return this.usersService.list();
  }

  @Query(() => User)
  @Roles(Role.WRITER)
  async me(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  @Mutation(() => User)
  @Roles(Role.OWNER)
  async createUser(@Args('input') input: CreateUserInput, @CurrentUser() actor: any) {
    return this.usersService.create({
      email: input.email,
      password: input.password,
      name: input.name,
      role: input.role,
    }, actor?.id);
  }

  @Mutation(() => User)
  @Roles(Role.ADMIN)
  async updateUser(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateUserInput,
    @CurrentUser() actor: any,
  ) {
    return this.usersService.update(id, input, actor?.id);
  }
}
