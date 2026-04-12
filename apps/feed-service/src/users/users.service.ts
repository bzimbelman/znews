import { Injectable } from "@nestjs/common";

@Injectable()
export class UsersService {
  async findAll() {
    return [];
  }

  async findOne(id: string) {
    return null;
  }

  async create(user: any) {
    return user;
  }
}
