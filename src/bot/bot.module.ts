import { Module } from "@nestjs/common";
import { BotService } from "./bot.service";
import { BotUpdate } from "./bot.update";
import { SequelizeModule } from "@nestjs/sequelize";
import { Bot } from "./models/bot.model";
import { Stuff } from "./models/staff.model";
import { StuffService } from "./stuff.service";
import { AdminService } from "./admin.service";
import { Admin } from "./models/admin.model";
import { Schedule } from "./models/schedule.model";

@Module({
  imports: [SequelizeModule.forFeature([Bot, Stuff,Admin,Schedule])],
  controllers: [],
  providers: [StuffService,BotService, BotUpdate,AdminService],
})
export class BotModule {}
