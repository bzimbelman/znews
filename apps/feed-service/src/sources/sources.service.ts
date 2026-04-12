import { Injectable } from "@nestjs/common";

@Injectable()
export class SourcesService {
  async findAll() {
    return [];
  }

  async findOne(id: string) {
    return null;
  }

  async create(source: any) {
    return source;
  }
}
