import { Injectable } from "@nestjs/common";

@Injectable()
export class ArticlesService {
  async findAll() {
    return [];
  }

  async findOne(id: string) {
    return null;
  }

  async create(article: any) {
    return article;
  }
}
