import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateArticleInput {
  @Field()
  title!: string;

  @Field({ nullable: true })
  excerpt?: string;

  @Field()
  content!: string;

  @Field({ nullable: true })
  categorySlug?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];
}
