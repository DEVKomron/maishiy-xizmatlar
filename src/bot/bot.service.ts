import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Bot } from "./models/bot.model";
import { InjectBot } from "nestjs-telegraf";
import { Context, Markup, Telegraf } from "telegraf";
import { BOT_NAME } from "../app.constants";
import { Stuff } from "./models/staff.model";
import * as haversine from "haversine-distance";
import { format } from "date-fns";
import { Schedule } from "./models/schedule.model";
import { InlineKeyboardButton } from "telegraf/types";
import { Op } from "sequelize";

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Bot) private readonly botModel: typeof Bot,
    @InjectModel(Stuff) private readonly stuffModel: typeof Stuff,
    @InjectModel(Schedule) private readonly scheduleModel: typeof Schedule,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) {}

  async start(ctx: Context) {

    await ctx.reply("Ro'yxatdan kim sifatida o'tmoqchisiz?", {
      reply_markup: {
        keyboard: [[{ text: "Usta" }, { text: "Mijoz" }]],
        one_time_keyboard: true,
        resize_keyboard: true,
      },
    });
  }

  async startUser(ctx: Context) {
    const user_id = ctx.from?.id;
    const user = await this.botModel.findByPk(user_id);

    if (!user) {
      await this.botModel.create({
        user_id,
        username: ctx.from?.username,
        first_name: ctx.from?.first_name,
        last_name: ctx.from?.last_name,
        lang: ctx.from?.language_code,
      });
      await ctx.reply(
        `Iltimos, <b>📞 Telefon raqamini yuborish</b> tugmasini bosing`,
        {
          parse_mode: "HTML",
          ...Markup.keyboard([
            [Markup.button.contactRequest("📞 Telefon raqamini yuborish")],
          ])
            .resize()
            .oneTime(),
        }
      );
    } else if (!user.status) {
      await ctx.reply(
        `Iltimos, <b>📞 Telefon raqamini yuborish</b> tugmasini bosing`,
        {
          parse_mode: "HTML",
          ...Markup.keyboard([
            [Markup.button.contactRequest("📞 Telefon raqamini yuborish")],
          ])
            .resize()
            .oneTime(),
        }
      );
    } else {
      await ctx.reply("Menu tanlang🧾", {
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [
            ["🛠 Xizmatlar", "📌 Tanlangan Xizmatlar"],
            ["📝 Ma'lumotlarni o'zgartirish"],
            ["❌ Profilni o'chirish"],
          ],
          resize_keyboard: true,
        },
      });
    }
  }

  async onContactUser(ctx: Context) {
    if ("contact" in ctx.message!) {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);
      if (!user) {
        await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
          parse_mode: "HTML",
          ...Markup.keyboard(["/start"]).resize().oneTime(),
        });
      } else if (ctx.message?.contact.user_id != user_id) {
        await ctx.reply(
          `Iltimos, <b>📞 Telefon raqamini yuborish</b> tugmasini bosing`,
          {
            parse_mode: "HTML",
            ...Markup.keyboard([
              [Markup.button.contactRequest("📞 Telefon raqamini yuborish")],
            ])
              .resize()
              .oneTime(),
          }
        );
      } else {
        user.phone_number = ctx.message.contact.phone_number;
        user.status = true;
        user.last_state = "name";
        await user.save();
        await ctx.reply(`Ismingizni kiriting`, {
          parse_mode: "HTML",
          ...Markup.removeKeyboard(),
        });
      }
    }
  }

  async onService(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);
      if (!user) {
        await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
          parse_mode: "HTML",
          ...Markup.keyboard(["/start"]).resize().oneTime(),
        });
      } else {
        await ctx.reply("Xizmat turlaridan birini tanlang📌", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Sartaroshxona✂️", callback_data: "cl_barber" }],
              [
                {
                  text: "Go'zallik Saloni💇‍♀️",
                  callback_data: "ser_beauty",
                },
              ],
              [{ text: "Soatsoz⌚️", callback_data: "cl_watch" }],
              [
                {
                  text: "Poyabzal ustaxonasi👞",
                  callback_data: "cl_shoe",
                },
              ],
              [{ text: "Boshqa...", callback_data: "cl_other" }],
            ],
          },
        });
      }
    } catch (error) {
      console.log("OnStop error:", error);
    }
  }

  async onClickedService(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);
      user!.search_type = "";
      user!.save();
      if (!user) {
        await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
          parse_mode: "HTML",
          ...Markup.keyboard(["/start"]).resize().oneTime(),
        });
      } else {
        const contextAction = ctx.callbackQuery!["data"];
        const contextMessage = ctx.callbackQuery!["message"];
        let type_ser = contextAction.split("_")[1];
        user.search_type = type_ser;
        await ctx.reply("Nima bo'yicha izlaymiz🔍", {
          parse_mode: "Markdown",
          reply_markup: {
            keyboard: [["🧾Ism", "🌟Reyting"], ["📍Lokatsiya"]],
            resize_keyboard: true,
          },
        });
      }
    } catch (error) {
      console.log("OnStop error:", error);
    }
  }

  async onSearchName(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);
      if (!user) {
        await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
          parse_mode: "HTML",
          ...Markup.keyboard(["/start"]).resize().oneTime(),
        });
      } else {
        await ctx.reply("Usta nomini kiriting✍️", {
          reply_markup: {
            keyboard: [["🏠 Asosiy menyu"]],
            resize_keyboard: true,
            one_time_keyboard: false,
          },
        });
      }
    } catch (error) {
      console.log("OnStop error:", error);
    }
  }

  async selectedServices(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);
      const schedule =await this.scheduleModel.findAll({where:{client_id:String(user_id)}})
      if (!user) {
        await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
          parse_mode: "HTML",
          ...Markup.keyboard(["/start"]).resize().oneTime(),
        });
      } else {
        if(schedule.length!==0){
                const now = new Date();
                schedule.forEach(async (schedule) => {
                  if (schedule.last_state === "finish") {
                    const scheduleDateTime = new Date(
                      `${schedule.day}T${schedule.time}`
                    );

                    if (scheduleDateTime >= now) {
                      const stuff = await this.stuffModel.findByPk(
                        schedule.stuff_id
                      );
                      let response = `🗓️ *Sana:* ${schedule.day}\n`;
                      response += `🕜 *Soat:* ${schedule.time}\n`;
                      response += `🤵 *Usta:* ${stuff!.name}\n`;
                      response += `📞 *Telefon:* ${stuff!.phone_number}\n`;
                      response += `────────────────────────\n`;

                      await ctx.reply(response, {
                        parse_mode: "HTML",
                      });
                      await ctx.reply("⬅️ *Asosiy menyuga qaytish mumkin", {
                        reply_markup: {
                          keyboard: [["🏠 Asosiy menyu"]],
                          resize_keyboard: true,
                          one_time_keyboard: false,
                        },
                      });
                    }
                  }
                });
        } else{
          await ctx.reply("Tanlangan xizmatlar mavjud emas", {
            parse_mode: "HTML"
          });
        }
     
      }
    } catch (error) {
      console.log("OnStop error:", error);
    }
  }

  async onRating(ctx: Context) {
    const user_id = ctx.from?.id;
    const user = await this.botModel.findByPk(user_id);
    const stuffs = await this.stuffModel.findAll({
      where: { status: true, service_type:user!.search_type},
      order: [["rating", "DESC"]],
    });

    if (!stuffs.length) {
      return await ctx.reply("⚠️ Hozircha hech qanday usta topilmadi.");
    }

    for (const stuff of stuffs) {
      const response =
        `👤 *Ism:* ${stuff.name}\n` +
        `⭐ *Reyting:* ${stuff.rating} ⭐\n` +
        `🏛️ *Manzil:* ${stuff.address}  \n` +
        `📞 *Telefon:* ${stuff.phone_number}\n` +
        `────────────────────────\n`;

      await ctx.reply(response, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🗓 Band qilish",
                callback_data: `book_${stuff.stuff_id}`,
              },
            ],
          ],
        },
      });
    }
    await ctx.reply("📋 Asosiy menyuga qaytish", {
      reply_markup: {
        keyboard: [["🏠 Asosiy menyu"]],
        resize_keyboard: true,
      },
    });
  }

  async onSearchLocation(ctx: Context) {
    const user_id = ctx.from?.id;
    const user = await this.botModel.findByPk(user_id);
    if (!user) {
      await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
        parse_mode: "HTML",
        ...Markup.keyboard(["/start"]).resize().oneTime(),
      });
    } else {
      await ctx.reply("📍 Iltimos, lokatsiyangizni yuboring:", {
        reply_markup: {
          keyboard: [
            [{ text: "📍 Lokatsiyani yuborish", request_location: true }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    }
  }

  async onLocation(ctx: Context) {
    if ("location" in ctx.message!) {
      const userLocation = ctx.message?.location;
       const user_id = ctx.from?.id;
       const user = await this.botModel.findByPk(user_id);
       console.log(userLocation);
       
      if (!userLocation) {
        return ctx.reply("❌ Lokatsiya olinmadi. Iltimos, qayta yuboring.");
      }
      const { latitude, longitude } = userLocation;
      const allStuffs = await this.stuffModel.findAll({where:{service_type:user!.search_type}});
      console.log(allStuffs);
      
      const sortedStuffs = allStuffs
        .map((stuff) => {
          const lat = stuff.location!.split(",")[0];
          const long = stuff.location!.split(",")[1];
          const stuffLocation = { latitude: +lat, longitude: +long };
          const distance = haversine(userLocation, stuffLocation) / 1000;
          return { ...stuff, distance };
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

      if (sortedStuffs.length==0) {
        return ctx.reply("🚫 Atrofingizda ustalar topilmadi.");
      }
      let response = "🏠 Eng yaqin ustalar:\n\n";
      sortedStuffs.forEach((stuff) => {
        response += `👤 *Ism:* ${stuff.dataValues.name}\n`;
        response += `⭐ *Reyting:* ${stuff.dataValues.rating}\n`;
        response += `🏢 *Mo'ljal:* ${stuff.dataValues.address}\n`;
        response += `📞 *Telefon:* ${stuff.dataValues.phone_number}\n`;
        response += `────────────────────────\n`;
      });
      await ctx.reply(response, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: sortedStuffs.map((stuff) => [
            { text: "🗓 Band qilish", callback_data: `book_${stuff.id}` },
          ]),
        },
      });
    }
  }

  async onBooking(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const contextAction = ctx.callbackQuery!["data"];
      const stuff_id = contextAction.split("_")[1];
      const stuff = await this.stuffModel.findByPk(stuff_id);
      const user = await this.botModel.findByPk(user_id);
      if (!user) {
        await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
          parse_mode: "HTML",
          ...Markup.keyboard(["/start"]).resize().oneTime(),
        });
      } else {
        if (!stuff) {
          await ctx.reply("Usta topilmadi🤷‍♂️🤷‍♂️", {
            parse_mode: "HTML",
          });
        } else {
          const stars = "⭐".repeat(Math.round(Number(stuff?.rating)));
          const masterInfo = `👨‍🔧 Usta: Ism: ${stuff.name}\n📞 Tel: ${stuff.phone_number}\n🔧 Xizmat turi: ${stuff.service_type}\n⭐ Reyting: ${(stuff.rating, stars)}/5\n,🏛️ *Manzil:* ${stuff.address}\n`;

          await ctx.reply(
            `${masterInfo}\n\nXizmat turlaridan birini tanlang📌`,
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: "Lokatsiya📍", callback_data: `loc_${stuff_id}` }],
                  [{ text: "Baholash⭐", callback_data: `rate_${stuff_id}` }],
                  [
                    {
                      text: "Vaqt olish📌",
                      callback_data: `lastbook_${stuff_id}`,
                    },
                  ],
                  [{ text: "Ortga🔙", callback_data: "back" }],
                ],
              },
            }
          );
        }
      }
    } catch (error) {
      console.log("OnStop error:", error);
    }
  }

  async onClickLocation(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const contextMessage = ctx.callbackQuery!["message"];
      const stuff_id = contextAction.split("_")[1];
      const stuff = await this.stuffModel.findByPk(stuff_id);
      await ctx.deleteMessage(contextMessage?.message_id);
      await ctx.replyWithLocation(
        Number(stuff?.location?.split(",")[0]),
        Number(stuff?.location?.split(",")[1])
      );
    } catch (error) {
      console.log(error);
    }
  }

  async onClickRate(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const stuff_id = contextAction.split("_")[1];
      await ctx.editMessageText("Ushbu ustani baholang: ⭐", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⭐", callback_data: `rating_1_${stuff_id}` }],
            [{ text: "⭐⭐", callback_data: `rating_2_${stuff_id}` }],
            [{ text: "⭐⭐⭐", callback_data: `rating_3_${stuff_id}` }],
            [{ text: "⭐⭐⭐⭐", callback_data: `rating_4_${stuff_id}` }],
            [{ text: "⭐⭐⭐⭐⭐", callback_data: `rating_5_${stuff_id}` }],
          ],
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async onClickBooking(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const stuff_id = contextAction.split("_")[1];
      const today = new Date();
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(today.getDate() + i);
        return {
          text: format(date, "dd.MM"),
          callback_data: `stepdate_${format(date, "yyyy-MM-dd")}_${stuff_id}`,
        };
      });
      const inlineKeyboard = days.map((day) => [day]);
      await ctx.reply("Quyidagi sanalardan birini tanlang:", {
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async onOccupyTime(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];

      const stuff_id = contextAction.split("_")[1];
      const decision = contextAction.split("_")[0];
      const schedule_id = contextAction.split("_")[2];
      const stuff = await this.stuffModel.findByPk(stuff_id);
      const schedule = await this.scheduleModel.findByPk(schedule_id);
      if (!stuff) {
        await ctx.reply("Master topilmadi", {
          parse_mode: "HTML",
        });
      } else {
        if (decision.startsWith("confirmOrder")){
  if (schedule?.last_state !== "finish") {
    schedule!.is_busy = true;
    schedule!.last_state = "finish";
    schedule!.save();
    await this.bot.telegram.sendMessage(
      String(schedule!.client_id),
      `✅ Usta sizni tasdiqladi!  
        👤 <b>Usta:</b> ${stuff!.name}  
        📞 <b>Telefon:</b> ${stuff.phone_number}  
        📅 <b>Sana:</b> ${schedule?.day}  
        ⌚ <b>Vaqt:</b> ${schedule?.time}`,
      {
        parse_mode: "HTML",
      }
    );
  } else {
    await ctx.reply("Siz allaqachon mijozni tasdiqlagansiz!");
  }
        }else if (decision.startsWith("cancelOrder")) {
           await this.bot.telegram.sendMessage(
             String(schedule!.client_id),
             `⛔ Usta sizni tasdiqlamadi! Noqulayliklar uchun uzur so'raymiz`,
             {
               parse_mode: "HTML",
             }
           );
        }
        
        
      }
    } catch (error) {
      console.log(error);
    }
  }

  async onClickedDateBooking(ctx: Context) {
    const user_id = ctx.from?.id;
    const contextAction = ctx.callbackQuery!["data"];
    const contextMessage = ctx.callbackQuery!["message"];
    let stuff_id = contextAction.split("_")[2];
    let date = contextAction.split("_")[1];
    const user = this.botModel.findByPk(user_id);
    const stuff = await this.stuffModel.findByPk(stuff_id);

    if (!user) {
      await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
        parse_mode: "HTML",
        ...Markup.keyboard(["/start"]).resize().oneTime(),
      });
    } else {
      if (!stuff) {
        await ctx.reply("Usta ma'lumotlar bazasidan topilmadi🤷‍♂️", {
          parse_mode: "HTML",
        });
      } else {
        const newOrder = await this.scheduleModel.create({
          day: date,
          client_id: String(user_id),
          stuff_id,
        });

        const timeSlots: InlineKeyboardButton[][] = [];
        let [startHour, startMin] = stuff
          .start_work_time!.split(":")
          .map(Number);
        let [endHour, endMin] = stuff.end_work_time!.split(":").map(Number);

        const startDate = new Date();
        startDate.setHours(startHour, startMin, 0);

        const endDate = new Date();
        endDate.setHours(endHour, endMin, 0);

        const bookedTimes = await Schedule.findAll({
          where: {
            stuff_id: stuff_id,
            day: date,
            time: { [Op.iLike]: "%" },
          },
          attributes: ["time"],
        }).then((rows) => rows.map((row) => row.time));

        const row: InlineKeyboardButton[] = [];

        while (startDate < endDate) {
          const formattedTime = format(startDate, "HH:mm");
          const isBooked = bookedTimes.includes(formattedTime);

          row.push({
            text: isBooked ? `${formattedTime} ❌` : formattedTime,
            callback_data: isBooked
              ? "booked"
              : `steptime_${formattedTime}_${newOrder.id}`,
          });

          if (row.length === 2) {
            timeSlots.push([...row]);
            row.length = 0;
          }

          startDate.setMinutes(startDate.getMinutes() + 30);
        }

        if (row.length) {
          timeSlots.push([...row]);
        }

        await ctx.reply("Quyidagi vaqtni tanlang:", {
          reply_markup: { inline_keyboard: timeSlots },
        });
      }
    }
  }

  async onClickedBookingTime(ctx: Context) {
    const user_id = ctx.from?.id;
    const contextAction = ctx.callbackQuery!["data"];
    let schedule_id = contextAction.split("_")[2];
    const schedule = await this.scheduleModel.findByPk(schedule_id);
    let time = contextAction.split("_")[1];
    const stuff = await this.stuffModel.findByPk(schedule?.stuff_id);
    const user = await this.botModel.findByPk(user_id);
    if (!user) {
      await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
        parse_mode: "HTML",
        ...Markup.keyboard(["/start"]).resize().oneTime(),
      });
    } else {
      await ctx.reply(`Siz tanlagan vaqt: <b>${time}</b>`, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📌 Band qilish",
                callback_data: `stepstatus_busy_${time}_${schedule_id}`,
              },
            ],
            [
              {
                text: "⬅️ Ortga",
                callback_data: `back_to_times_${schedule_id}`,
              },
            ],
          ],
        },
      });
    }
  }

  async onOccupyMasterTime(ctx: Context) {
    const user_id = ctx.from?.id;
    const contextAction = ctx.callbackQuery!["data"];
    let schedule_id = contextAction.split("_")[3];
    let time = contextAction.split("_")[2];
    const schedule = await this.scheduleModel.findByPk(schedule_id);
    const user = await this.botModel.findByPk(user_id);
    const stuff = await this.stuffModel.findByPk(schedule!.stuff_id);
    console.log(user);

    if (!user) {
      await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
        parse_mode: "HTML",
        ...Markup.keyboard(["/start"]).resize().oneTime(),
      });
    } else {
      if (contextAction.startsWith("stepstatus_busy")) {
        schedule!.time = time;
        schedule!.save();
        const message =
          `*🛠️ Mijoz haqida ma'lumot:*\n\n` +
          `*📌 Ismi:* ${user!.first_name ?? "Noma'lum"}\n` +
          `*📞 Telefon raqami:* ${user!.phone_number ?? "Noma'lum"}\n` +
          `*⏳ Band qilish vaqtin:* ${schedule!.time ?? "Noma'lum"}\n`;

        await this.bot.telegram.sendMessage(String(stuff?.stuff_id), message, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✅ Tasdiqlash",
                  callback_data: `confirmOrder_${stuff!.stuff_id}_${schedule_id}`,
                },
                {
                  text: "❌ Bekor qilish",
                  callback_data: `cancelOrder_${stuff!.stuff_id}_${schedule_id}`,
                },
              ],
            ],
          },
        });
      }
    }

    if (!user) {
    } else {
    }
  }

  async onClickedRating(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const dataParts = contextAction.split("_");

      const stuff_id = Number(dataParts[2]);
      const rating = Number(dataParts[1]);

      if (isNaN(stuff_id) || isNaN(rating))
        return ctx.reply("Xatolik yuz berdi!");

      const stuff = await this.stuffModel.findByPk(stuff_id);
      if (!stuff) return ctx.reply("Usta topilmadi!");

      let current_rating = Number(stuff.rating) || 0;
      let rating_count = Number(stuff.rating_count) || 0;

      let new_rating =
        (current_rating * rating_count + rating) / (rating_count + 1);
      new_rating = Number(new_rating.toFixed(1));

      await this.stuffModel.update(
        { rating: String(new_rating), rating_count: String(rating_count + 1) },
        { where: { stuff_id } }
      );

      await ctx.editMessageText(
        `Siz ${"⭐".repeat(rating)} bahosini berdingiz! Ustani umumiy bahosi: ${new_rating} ⭐`
      );
    } catch (error) {
      console.error("Baholashda xatolik:", error);
      await ctx.reply("Baholashda xatolik yuz berdi. Qayta urinib ko‘ring!");
    }
  }

  async onText(ctx: Context) {
    if ("text" in ctx.message!) {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);

      if (!user || !user.status) {
        await ctx.reply(`Siz avval ro'yxatdan o'ting🛑`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]]).resize(),
        });
      } else {
      }
    }
  }
}
