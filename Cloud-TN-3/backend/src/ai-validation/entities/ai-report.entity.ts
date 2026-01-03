import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AIReport {
  @Field(() => ID)
  id!: number;

  @Field({ nullable: true })
  originalityScore?: number;

  @Field({ nullable: true })
  seoScore?: number;

  @Field({ nullable: true })
  structureValid?: boolean;

  @Field({ nullable: true })
  aiProbability?: number;

  @Field({ nullable: true })
  feedback?: string;

  @Field({ nullable: true })
  modelUsed?: string;

  @Field(() => Date)
  createdAt!: Date;
}
