import { Controller, Get } from '@nestjs/common';
import { utils } from '@recruit-hub/utils';
@Controller('user')
export class UserController {
  @Get()
  getData() {
    return utils();
  }
}
