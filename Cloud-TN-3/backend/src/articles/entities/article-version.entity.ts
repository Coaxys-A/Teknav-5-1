import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ArticleVersionEntity {
  @Field()
  id!: number;

  @Field()
  articleId!: number;

  @Field()
  title!: string;

  @Field()
  content!: string;

  @Field({ nullable: true })
  excerpt?: string | null;

  @Field({ nullable: true })
  tags?: string | null;

  @Field()
  status!: string;

  @Field()
  createdAt!: Date;
}
