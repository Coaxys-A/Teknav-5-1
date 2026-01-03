import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WordpressService {
  private readonly logger = new Logger(WordpressService.name);
  private readonly baseUrl: string;
  private readonly graphqlEndpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('WP_BASE_URL') ?? '';
    this.graphqlEndpoint = this.configService.get<string>('WP_GRAPHQL_ENDPOINT') ?? '';
  }

  async fetchLatestPosts(limit = 5) {
    if (!this.graphqlEndpoint) {
      this.logger.warn('WP_GRAPHQL_ENDPOINT not configured; returning empty list');
      return [];
    }

    const query = `
      query LatestPosts($limit: Int!) {
        posts(first: $limit, where: { status: PUBLISH }) {
          nodes {
            id
            title
            excerpt
            slug
            date
          }
        }
      }
    `;

    const response = await axios.post(
      this.graphqlEndpoint,
      { query, variables: { limit } },
      { headers: { 'Content-Type': 'application/json' } },
    );

    return response.data?.data?.posts?.nodes ?? [];
  }
}
