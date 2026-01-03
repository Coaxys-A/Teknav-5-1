import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { AIReport } from '../../ai-validation/entities/ai-report.entity';

@ObjectType()
export class Article {
  @Field(() => ID)
  id!: number;

  @Field()
  title!: string;

  @Field()
  slug!: string;

  @Field({ nullable: true })
  excerpt?: string;

  @Field()
  content!: string;

  @Field()
  status!: string;

  @Field({ nullable: true })
  categorySlug?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => User, { nullable: true })
  author?: User;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field(() => [AIReport], { nullable: true })
  aiReports?: AIReport[];
}
