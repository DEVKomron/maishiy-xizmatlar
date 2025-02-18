import { Injectable } from "@nestjs/common";
import { Bot } from "./models/bot.model";
import { Stuff } from "./models/staff.model";
import { Action, Command, Ctx, Hears, InjectBot, On, Start, Update } from "nestjs-telegraf";
import {Context,Telegraf} from "telegraf"
import { BOT_NAME } from "../app.constants";
import { InjectModel } from "@nestjs/sequelize";
import { Admin } from "./models/admin.model";
import { Schedule } from "./models/schedule.model";



@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Bot) private readonly botModel: typeof Bot,
    @InjectModel(Stuff) private readonly stuffModel: typeof Stuff,
    @InjectModel(Admin) private readonly adminModel: typeof Admin,
    @InjectModel(Schedule) private readonly scheduleModel: typeof Schedule,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) {}

  async admin(ctx: Context) {
    const admin_id = 1725480158;
    const send_id = ctx.from?.id;
    const findAdmin = await this.adminModel.findByPk(admin_id);
    if (admin_id !== send_id) {
      await ctx.reply(
        `Siz admin emassiz. Botdan foydalanish uchun start tugmasi bosiladi`,
        {
          parse_mode: "HTML",
        }
      );
    } else {
      if (!findAdmin) {
        await this.adminModel.create({
          admin_id,
          username: ctx.from?.username,
          first_name: ctx.from?.first_name,
          last_name: ctx.from?.last_name,
          lang: ctx.from?.language_code,
        });
      }

      await ctx.reply("Assalom Alaykum Admin tog'a tizimga xush kelibsiz✅👨‍💼", {
        reply_markup: {
          keyboard: [[{ text: "Mijozlar ro'yxati" }, { text: "Arizalar" }]],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      });
    }
  }

  async checkStuff(ctx: Context) {
    const send_id = ctx.from?.id;
    const findAdmin = await this.adminModel.findByPk(send_id);
    const contextAction = ctx.callbackQuery!["data"];
    let stuff_id = contextAction.split("_")[1];
    let decision = contextAction.split("_")[0];
    const findStuff = await this.stuffModel.findByPk(stuff_id);

    if (!findAdmin) {
      await ctx.reply(
        `Siz admin emassiz. Botdan foydalanish uchun start tugmasi bosiladi`,
        {
          parse_mode: "HTML",
        }
      );
    } else {
      if (!findStuff) {
        await ctx.reply(`Ishchi ma'lumotlar bazasidan topilmadi`, {
          parse_mode: "HTML",
        });
      }

      if (decision == "confirmStuff") {
        findStuff!.last_state = "finish";
        findStuff!.save();
        await this.scheduleModel.create({stuff_id})
        await this.bot.telegram.sendMessage(
          String(findStuff?.stuff_id),
          "Siz muvaffaqiyatli ro'yxatdan o'tdingiz✅",
          {
            parse_mode: "Markdown",
            reply_markup: {
              keyboard: [
                ["👥 Mijozlar", "🕒 Vaqt", "⭐ Reyting"],
                ["📝 Ma'lumotlarni o'zgartirish"],
                ["❌ Profilni o'chirish"],
              ],
              resize_keyboard: true,
              one_time_keyboard: false,
            },
          }
        );
      } else if (decision == "cancelStuff") {
        await this.stuffModel.update(
          {
            name: "",
            place_name: "",
            location: "",
            address: "",
            orient: "",
            service_type: "",
            start_work_time: "",
            end_work_time: "",
            spend_time: "",
            last_state: "service_type",
          },
          { where: { stuff_id }, returning: true }
        );
        await this.bot.telegram.sendMessage(
          String(findStuff?.stuff_id),
          "Afsuski ro'yxatdan o'ta olmadingiz⛔ Admin bilan bog'laning yoki qaytadan harakat qilib ko'ring",
          {
            parse_mode: "Markdown",
          }
        );
      }
    }
  }
}