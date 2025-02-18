import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Bot } from "./models/bot.model";
import { Ctx, InjectBot } from "nestjs-telegraf";
import { Context, Markup, Telegraf } from "telegraf";
import { BOT_NAME } from "../app.constants";
import { Stuff } from "./models/staff.model";
import { Admin } from "./models/admin.model";
import { format } from "date-fns";
import { Schedule } from "./models/schedule.model";
import { InlineKeyboardButton } from "telegraf/types";
import { Op, where } from "sequelize";
@Injectable()
export class StuffService {
  constructor(
    @InjectModel(Bot) private readonly botModel: typeof Bot,
    @InjectModel(Stuff) private readonly stuffModel: typeof Stuff,
    @InjectModel(Admin) private readonly adminModel: typeof Admin,
    @InjectModel(Schedule) private readonly scheduleModel: typeof Schedule,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) {}

  async startStuff(ctx: Context) {
    const stuff_id = ctx.from?.id;
    const stuff = await this.stuffModel.findByPk(stuff_id);

    if (!stuff) {
      await this.stuffModel.create({ stuff_id });
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
    } else if (!stuff.status) {
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
      if (stuff.last_state != "finish") {
        await ctx.reply(
          "Usta sifatida ro'yxatdan o'tish uchun kerakli bo'limlardan birini tanlang",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Sartaroshxona✂️", callback_data: "ser_barber" }],
                [{ text: "Go'zallik Saloni💇‍♀️", callback_data: "ser_beauty" }],
                [{ text: "Soatsoz⌚️", callback_data: "ser_watch" }],
                [{ text: "Poyabzal ustaxonasi👞", callback_data: "ser_shoe" }],
                [{ text: "Boshqa...", callback_data: "ser_other" }],
              ],
            },
          }
        );
      } else {
        await ctx.reply("Menu tanlang🧾🧾", {
          parse_mode: "Markdown",
          reply_markup: {
            keyboard: [
              ["👥 Mijozlar", "🕒 Vaqt", "Mening Reytingim ⭐️"],
              ["📝 Ma'lumotlarni o'zgartirish"],
              ["❌ Profilni o'chirish"],
            ],
            resize_keyboard: true,
          },
        });
      }
    }
  }

  async onContactStuff(ctx: Context) {
    if ("contact" in ctx.message!) {
      const stuff_id = ctx.from?.id;
      const stuff = await this.stuffModel.findByPk(stuff_id);
      if (!stuff) {
        await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
          parse_mode: "HTML",
          ...Markup.keyboard(["/start"]).resize().oneTime(),
        });
      } else if (ctx.message?.contact.user_id != stuff_id) {
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
        stuff.phone_number = ctx.message.contact.phone_number;
        stuff.status = true;
        await stuff.save();
        await ctx.reply(`Tabriklayman, sizning hisobingiz faollashtirildi!✅`, {
          parse_mode: "HTML",
          ...Markup.removeKeyboard(),
        });

        await ctx.reply(
          "Usta sifatida ro'yxatdan o'tish uchun kerakli bo'limlardan birini tanlang",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Sartaroshxona✂️", callback_data: "ser_barber" }],
                [{ text: "Go'zallik Saloni💇‍♀️", callback_data: "ser_beauty" }],
                [{ text: "Soatsoz⌚️", callback_data: "ser_watch" }],
                [{ text: "Poyabzal ustaxonasi👞", callback_data: "ser_shoe" }],
                [{ text: "Boshqa...", callback_data: "ser_other" }],
              ],
            },
          }
        );
      }
    }
  }

  async onClickedService(ctx: Context) {
    const stuff_id = ctx.from?.id;
    const stuff = await this.stuffModel.findByPk(stuff_id);
    const contextAction = ctx.callbackQuery!["data"];
    const contextMessage = ctx.callbackQuery!["message"];
    let type_ser = contextAction.split("_")[1];

    if (!stuff) {
      await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
        parse_mode: "HTML",
        ...Markup.keyboard(["/start"]).resize().oneTime(),
      });
    }

    stuff!.service_type = type_ser;
    stuff!.last_state = "name";
    stuff!.save();
    await ctx.reply(`Ismingizni kiriting`, {
      parse_mode: "HTML",
    });
  }

  async onText(ctx: Context) {
    if ("text" in ctx.message!) {
      const stuff_id = ctx.from?.id;
      const stuff = await this.stuffModel.findByPk(stuff_id);
      const user = await this.botModel.findByPk(stuff_id);

      if (stuff) {
        if (!stuff || !stuff.status) {
          await ctx.reply(`Siz avval ro'yxatdan o'ting`, {
            parse_mode: "HTML",
            ...Markup.keyboard([["/start"]]).resize(),
          });
        } else {
          if (stuff.last_state !== "finish") {
            if (stuff.last_state == "name") {
              stuff.last_state = "place_name";
              stuff.name = ctx.message.text;
              await stuff.save();
              await ctx.reply("Ustaxona nomini kiriting", {
                reply_markup: {
                  keyboard: [[{ text: "O'tkazib yuborish" }]],
                  one_time_keyboard: true,
                  resize_keyboard: true,
                },
              });
            } else if (stuff.last_state == "place_name") {
              if (ctx.message.text !== "O'tkazib yuborish") {
                stuff.place_name = ctx.message.text;
              }
              stuff.last_state = "address";
              await stuff.save();
              await ctx.reply("Ustaxona manzilini kiriting", {
                reply_markup: {
                  keyboard: [[{ text: "O'tkazib yuborish" }]],
                  one_time_keyboard: true,
                  resize_keyboard: true,
                },
              });
            } else if (stuff.last_state == "address") {
              if (ctx.message.text !== "O'tkazib yuborish") {
                stuff.address = ctx.message.text;
              }
              stuff.last_state = "orient";
              await stuff.save();
              await ctx.reply("Mo'ljal kiriting", {
                reply_markup: {
                  keyboard: [[{ text: "O'tkazib yuborish" }]],
                  one_time_keyboard: true,
                  resize_keyboard: true,
                },
              });
            } else if (stuff.last_state == "orient") {
              if (ctx.message.text !== "O'tkazib yuborish") {
                stuff.orient = ctx.message.text;
              }
              stuff.last_state = "location";
              await stuff.save();
              await ctx.reply(`Lokatsiya kiriting`, {
                parse_mode: "HTML",
                ...Markup.keyboard([
                  [Markup.button.locationRequest("Lokatsiya")],
                ]).resize(),
              });
            }
          }
        }
      }
      if (user) {
        if (!user || !user.status) {
          await ctx.reply(`Siz avval ro'yxatdan o'ting`, {
            parse_mode: "HTML",
            ...Markup.keyboard([["/start"]]).resize(),
          });
        } else {
          if (user!.last_state !== "finish") {
            if (user?.last_state === "name") {
              user.username = ctx.message.text;
              user.last_state = "finish";
              await user.save();
              await ctx.reply("Menu tanlang 🧾", {
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
        }

        if (user.last_state == "finish" && user.search_type) {
          const name = ctx.message.text;
          const stuffs = await this.stuffModel.findAll({
            where: { name, service_type: user.search_type },
          });
          console.log(stuffs);

          if (stuffs.length !== 0) {
            let response = `🔎 **${user.search_type} bo‘yicha topilgan ustalar:**\n\n`;
            stuffs.forEach(async (stuff) => {
              const stars = "⭐".repeat(Math.round(Number(stuff?.rating)));
              let response = `👤 *Ism:* ${stuff.name}\n`;
              response += `⭐ *Reyting:* ${stuff.rating} ${stars}\n`;
              response += `🏢 *Manzil:* ${stuff.address}\n`;
              response += `📞 *Telefon:* ${stuff.phone_number}\n`;
              response += `────────────────────────\n`;

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
              await ctx.reply(
                "📅 *Ustani band qilish yoki* ⬅️ *Asosiy menyuga qaytish mumkin",
                {
                  reply_markup: {
                    keyboard: [["🏠 Asosiy menyu"]],
                    resize_keyboard: true,
                    one_time_keyboard: false,
                  },
                }
              );
            });
          } else {
            await ctx.reply("❌ *Kechirasiz, bunday usta topilmadi!*", {
              parse_mode: "Markdown",
              reply_markup: {
                keyboard: [["🔄 Qayta qidirish", "🏠 Asosiy menyu"]],
                resize_keyboard: true,
              },
            });
          }
        }
      }
    }
  }

  async onLocation(ctx: Context) {
    try {
      if ("location" in ctx.message!) {
        const stuff_id = ctx.from?.id;
        const stuff = await this.stuffModel.findByPk(stuff_id);

        if (!stuff || !stuff.status) {
          await ctx.reply(`Siz avval ro'yxatdan o'ting`, {
            parse_mode: "HTML",
            ...Markup.keyboard([["/start"]]).resize(),
          });
        }

        if (stuff!.last_state == "location") {
          stuff!.location = `${ctx.message.location.latitude},${ctx.message.location.longitude}`;
          stuff!.last_state = "start_work_time";
          await stuff!.save();
          await ctx.reply(`⏳ *Ish boshlanish vaqtini tanlang:*`, {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🌅 07:00", callback_data: "start_07:00" },
                  { text: "🌅 08:00", callback_data: "start_08:00" },
                  { text: "🌞 09:00", callback_data: "start_09:00" },
                ],
                [
                  { text: "🌞 10:00", callback_data: "start_10:00" },
                  { text: "🌞 11:00", callback_data: "start_11:00" },
                  { text: "🌞 12:00", callback_data: "start_12:00" },
                ],
                [
                  { text: "☀️ 13:00", callback_data: "start_13:00" },
                  { text: "☀️ 14:00", callback_data: "start_14:00" },
                ],
                [{ text: "Boshqa vaqt ⏳", callback_data: "start_other" }],
              ],
            },
          });
        }
      }
    } catch (error) {
      console.log("OnLocation error:", error);
    }
  }

  async onClickedStartTime(ctx: Context) {
    const stuff_id = ctx.from?.id;
    const stuff = await this.stuffModel.findByPk(stuff_id);
    const contextAction = ctx.callbackQuery!["data"];
    const contextMessage = ctx.callbackQuery!["message"];
    let start_time = contextAction.split("_")[1];

    if (!stuff) {
      await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
        parse_mode: "HTML",
        ...Markup.keyboard(["/start"]).resize().oneTime(),
      });
    }

    if (stuff!.last_state == "start_work_time") {
      stuff!.start_work_time = start_time;
      stuff!.last_state = "end_work_time";
      stuff!.save();
    }

    await ctx.reply(`🔚 *Ish tugash vaqtini tanlang:*`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🕒 15:00", callback_data: "end_15:00" },
            { text: "🕓 16:00", callback_data: "end_16:00" },
            { text: "🕔 17:00", callback_data: "end_17:00" },
          ],
          [
            { text: "🕕 18:00", callback_data: "end_18:00" },
            { text: "🕖 19:00", callback_data: "end_19:00" },
            { text: "🕗 20:00", callback_data: "end_20:00" },
          ],
          [
            { text: "🕘 21:00", callback_data: "end_21:00" },
            { text: "🕙 22:00", callback_data: "end_22:00" },
          ],
          [{ text: "Boshqa vaqt ⏳", callback_data: "end_other" }],
        ],
      },
    });
  }

  async onClickedEndTime(ctx: Context) {
    const stuff_id = ctx.from?.id;
    const stuff = await this.stuffModel.findByPk(stuff_id);
    const contextAction = ctx.callbackQuery!["data"];
    const contextMessage = ctx.callbackQuery!["message"];
    let end_time = contextAction.split("_")[1];
    if (!stuff) {
      await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
        parse_mode: "HTML",
        ...Markup.keyboard(["/start"]).resize().oneTime(),
      });
    }

    if (stuff!.last_state == "end_work_time") {
      stuff!.end_work_time = end_time;
      stuff!.last_state = "spend_time";
      stuff!.save();
    }
    await ctx.reply(
      `⏳ *Har bir mijoz uchun o'rtacha sarflanadigan vaqtni tanlang:*`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🕒 20 daqiqa", callback_data: "avg_20m" },
              { text: "🕕 30 daqiqa", callback_data: "avg_30m" },
            ],
            [
              { text: "🕘 40 daqiqa", callback_data: "avg_40m" },
              { text: "🕛 50 daqiqa", callback_data: "avg_50m" },
            ],
            [
              { text: "⏳ 1 soat", callback_data: "avg_1h" },
              { text: "⏳ 1 soat 30 min", callback_data: "avg_1h30m" },
            ],
            [{ text: "Boshqa vaqt ⏳", callback_data: "avg_other" }],
          ],
        },
      }
    );
  }

  async onClickedSpendTime(ctx: Context) {
    const stuff_id = ctx.from?.id;
    const stuff = await this.stuffModel.findByPk(stuff_id);
    const contextAction = ctx.callbackQuery!["data"];
    const contextMessage = ctx.callbackQuery!["message"];
    let spend_time = contextAction.split("_")[1];
    if (!stuff) {
      await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
        parse_mode: "HTML",
        ...Markup.keyboard(["/start"]).resize().oneTime(),
      });
    }
    if (stuff!.last_state == "spend_time") {
      stuff!.spend_time = spend_time;
      stuff!.last_state = "pending";
      stuff!.save();
    }
    await ctx.reply(`✅ *Tasdiqlash yoki bekor qilishni tanlang:*`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Tasdiqlash", callback_data: "confirm" },
            { text: "❌ Bekor qilish", callback_data: "cancel" },
          ],
        ],
      },
    });
  }

  async onConfirm(ctx: Context) {
    const stuff_id = ctx.from?.id;
    const stuff = await this.stuffModel.findByPk(stuff_id);
    const contextAction = ctx.callbackQuery!["data"];

    if (!stuff) {
      await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
        parse_mode: "HTML",
        ...Markup.keyboard(["/start"]).resize().oneTime(),
      });
    }
    if (contextAction == "confirm") {
      stuff!.last_state = "pending";
      stuff?.save();

      await ctx.reply(
        `✅ *Ma'lumotlaringiz adminga jo'natildi tez orada tasdiqlangandan so'ng xabar beramiz*`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "👁️ Tekshirish", callback_data: "check" },
                { text: "❌ Bekor qilish", callback_data: "cancel" },
                { text: "📱 Admin bilan bog'lanish", callback_data: "contact" },
              ],
            ],
          },
        }
      );

      const findAdmin = await this.adminModel.findOne();
      if (findAdmin) {
        const message =
          `*🛠️ Usta haqida ma'lumot:*\n\n` +
          `*📌 Ismi:* ${stuff!.name ?? "Noma'lum"}\n` +
          `*🏠 Manzil:* ${stuff!.address ?? "Noma'lum"}\n` +
          `*📍 Joy nomi:* ${stuff!.place_name ?? "Noma'lum"}\n` +
          `*📞 Telefon raqami:* ${stuff!.phone_number ?? "Noma'lum"}\n` +
          `*🕒 Ish vaqti:* ${stuff!.start_work_time ?? "Noma'lum"} - ${stuff!.end_work_time ?? "Noma'lum"}\n` +
          `*⏳ Ish davomiyligi:* ${stuff!.spend_time ?? "Noma'lum"}\n` +
          `*🔧 Xizmat turi:* ${stuff!.service_type ?? "Noma'lum"}\n` +
          `*🔄 So‘nggi holat:* ${stuff!.last_state ?? "Noma'lum"}`;

        await this.bot.telegram.sendMessage(
          String(findAdmin?.admin_id),
          message,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "✅ Tasdiqlash",
                    callback_data: `confirmStuff_${stuff_id}`,
                  },
                  {
                    text: "❌ Bekor qilish",
                    callback_data: `cancelStuff_${stuff_id}`,
                  },
                ],
              ],
            },
          }
        );
      }
    } else if (contextAction == "cancel") {
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

      await ctx.reply(
        "Usta sifatida ro'yxatdan o'tish uchun kerakli bo'limlardan birini tanlang",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Sartaroshxona✂️", callback_data: "ser_barber" }],
              [{ text: "Go'zallik Saloni💇‍♀️", callback_data: "ser_beauty" }],
              [{ text: "Soatsoz⌚️", callback_data: "ser_watch" }],
              [{ text: "Poyabzal ustaxonasi👞", callback_data: "ser_shoe" }],
              [{ text: "Boshqa...", callback_data: "ser_other" }],
            ],
          },
        }
      );
    }
  }

  async onSelectDate(ctx: Context) {
    const contextAction = ctx.callbackQuery!["data"];
    const contextMessage = ctx.callbackQuery!["message"];
    let stuff_id = contextAction.split("_")[2];
    let date = contextAction.split("_")[1];
    const findSchedule = await this.scheduleModel.findOne({
      where: { stuff_id },
    });
    const stuff = await this.stuffModel.findByPk(stuff_id);
    if (!stuff) {
      await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
        parse_mode: "HTML",
        ...Markup.keyboard(["/start"]).resize().oneTime(),
      });
    } else {
      if (!findSchedule) {
        await ctx.reply(
          "Siz hali tasdiqlanmagan foydalanuvchisiz! Iltimos admin tasdiqlashini kuting🕧",
          {
            parse_mode: "HTML",
          }
        );
      } else {
        findSchedule.day = date;
        findSchedule.save();

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
              : `time_${formattedTime}_${findSchedule.id}`,
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

  async onClickedTime(ctx: Context) {
    const stuff_id = ctx.from?.id;
    const contextAction = ctx.callbackQuery!["data"];
    let schedule_id = contextAction.split("_")[2];
    let time = contextAction.split("_")[1];
    const stuff = await this.stuffModel.findByPk(stuff_id);
    if (!stuff) {
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
                text: "✅ Bo'sh",
                callback_data: `status_free_${time}_${schedule_id}`,
              },
              {
                text: "❌ Band",
                callback_data: `status_busy_${time}_${schedule_id}`,
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

  async onOccupyTime(ctx: Context) {
    const stuff_id = ctx.from?.id;
    const contextAction = ctx.callbackQuery!["data"];
    let schedule_id = contextAction.split("_")[3];
    let time = contextAction.split("_")[2];
    const stuff = await this.stuffModel.findByPk(stuff_id);
    const schedule = await this.scheduleModel.findByPk(schedule_id);
    if (!stuff) {
      await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
        parse_mode: "HTML",
        ...Markup.keyboard(["/start"]).resize().oneTime(),
      });
    } else {
      if (contextAction.startsWith("status_free")) {
        schedule!.time = time;
        schedule!.is_busy = false;
        schedule!.save();
      } else if (contextAction.startsWith("status_busy")) {
        await this.scheduleModel.create({
          stuff_id: ctx.from?.id,
          day: schedule!.day,
          time: time,
          is_busy: true,
        });
      }
    }
  }

  async onCheckTime(ctx: Context) {
    const stuff_id = ctx.from?.id;
    const stuff = await this.stuffModel.findByPk(stuff_id);
    if (stuff!.last_state == "finish") {
      const today = new Date();
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(today.getDate() + i);
        return {
          text: format(date, "dd.MM"),
          callback_data: `date_${format(date, "yyyy-MM-dd")}_${stuff_id}`,
        };
      });
      const inlineKeyboard = days.map((day) => [day]);
      await ctx.reply("Quyidagi sanalardan birini tanlang:", {
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      });
    }
  }

  async stuffRating(ctx: Context) {
    const stuff_id = ctx.from?.id;
    const stuff = await this.stuffModel.findByPk(stuff_id);
    if (!stuff) {
      await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
        parse_mode: "HTML",
        ...Markup.keyboard(["/start"]).resize().oneTime(),
      });
    } else {
      if (stuff.last_state == "finish") {
        const rating = stuff.rating || 0;
        let response = `⭐ *Usta reytingi:* ${rating}/5\n`;
        await ctx.reply(response, { parse_mode: "Markdown" });
      }
    }
  }

  async onCheckClients(ctx: Context) {
    const stuff_id = ctx.from?.id;
    const stuff = await this.stuffModel.findByPk(stuff_id);
    const schedule = await this.scheduleModel.findAll({
      where: { stuff_id: String(stuff_id) },
    });
    if (!stuff) {
      await ctx.reply("Ma'lumotlar bazasida usta mavjud emas");
    } else {
      if (schedule) {
        const now = new Date();
        schedule.forEach(async (schedule) => {
          if (schedule.last_state === "finish") {
            const scheduleDateTime = new Date(
              `${schedule.day}T${schedule.time}`
            );

            if (scheduleDateTime >= now) {
                if(!schedule.client_id){
                   let response = `🗓️ *Sana:* ${schedule.day}\n`;
                   response += `🕜 *Soat:* ${schedule.time}\n`;
                   await ctx.reply(response, {
                     parse_mode: "HTML",
                   });
                }else{
                 const user = await this.botModel.findByPk(schedule.client_id);
                  let response = `🗓️ *Sana:* ${schedule.day}\n`;
                  response += `🕜 *Soat:* ${schedule.time}\n`;
                  response += ``;
                  response += `📞 *Telefon:* ${user?.phone_number}\n`;
                  response += `────────────────────────\n`;
                   await ctx.reply(response, {
                   parse_mode: "HTML",
                 });
                }
              await ctx.reply("⬅️ *Asosiy menyuga qaytish mumkin", {
                reply_markup: {
                  keyboard: [["Asosiy menyu 🏠"]],
                  resize_keyboard: true,
                  one_time_keyboard: false,
                },
              });
            }
          }
        });
      }
      await ctx.reply("⬅️ *Asosiy menyuga qaytish ", {
        reply_markup: {
          keyboard: [["Asosiy menyu 🏠"]],
          resize_keyboard: true,
          one_time_keyboard: false,
        },
      });
    }
  }

  async onCheck(ctx: Context) {
    const stuff_id = ctx.from?.id;
    const stuff = await this.stuffModel.findByPk(stuff_id);

    if (!stuff) {
      await ctx.reply("Iltimos <b>Start</b> tugmasini bosing🔘", {
        parse_mode: "HTML",
        ...Markup.keyboard(["/start"]).resize().oneTime(),
      });
    } else {
      if (stuff.last_state == "service_type") {
        await ctx.reply(
          "Sizning arizangiz tasdiqlanmagan iltimos qayta ro'yxatdan o'ting😊",
          {
            parse_mode: "HTML",
          }
        );
      } else if (stuff.last_state == "finish") {
        await ctx.reply(
          "Siz allaqachon tasdiqlangan foydalanuvchi siz! Ishlaringizga rivoj tilaymiz🎊",
          {
            parse_mode: "HTML",
          }
        );
      } else if (stuff.last_state == "pending") {
        await ctx.reply(
          "Arizangiz kutish jarayonida! Iltimos Admin tasdiqlashini kuting⌚",
          {
            parse_mode: "HTML",
          }
        );
      }
    }
  }
}

//   async onCar(ctx: Context) {
//     try {
//       const user_id = ctx.from?.id;
//       const user = await this.botModel.findByPk(user_id);
//          if (!user || !user.status) {
//           await ctx.reply(`Siz avval ro'yxatdan o'ting`, {
//             parse_mode: "HTML",
//             ...Markup.keyboard([["/start"]]).resize(),
//           });

//         }
//       await ctx.reply(`Foydalanuvchi avtomobillari`, {
//         parse_mode: "HTML",
//         ...Markup.keyboard([
//           ["Mening avtomobillarim", "Yangi avto qo'shish"],
//         ]).resize(),
//       });

//     } catch (error) {
//       console.log("OnStop error:", error);
//     }
//   }

//   async onCommandNewCar(ctx: Context) {
//     const user_id = ctx.from?.id;
//     const user = await this.botModel.findByPk(user_id);

//     if (!user || !user.status) {
//       await ctx.reply(`Siz avval ro'yxatdan o'ting`, {
//         parse_mode: "HTML",
//         ...Markup.keyboard([["/start"]]).resize(),
//       });
//     } else {
//       await this.carModel.create({ user_id, last_state: "car_number" });
//       await ctx.reply(`Moshinangiz raqamini kiriting`, {
//         parse_mode: "HTML",
//         ...Markup.removeKeyboard(),
//       });
//     }
//   }

//   async onCommandMyCars(ctx: Context) {
//     const user_id = ctx.from?.id;
//     const user = await this.botModel.findByPk(user_id);

//     if (!user || !user.status) {
//       await ctx.reply(`Siz avval ro'yxatdan o'ting`, {
//         parse_mode: "HTML",
//         ...Markup.keyboard([["/start"]]).resize(),
//       });
//     } else {
//       const cars = await this.carModel.findAll({
//         where: { user_id, last_state: "finish" },
//       });
//       cars.forEach(async (car) => {
//         await ctx.replyWithHTML(
//           `<b>Mashina raqami: ${car.car_number}</b>\n<b>Mashina modeli: ${car.model}</b>\n<b>Mashina rangi: ${car.color}</b>\n<b>Mashina yili: ${car.year}</b>\n`,
//           {
//             reply_markup: {
//               inline_keyboard: [
//                 [
//                   { text: "Tahrirlash✏️", callback_data: `ed_${car.id}` },
//                   {
//                     text: "O'chirish🗑",
//                     callback_data: `del_${car.id}`,
//                   },
//                 ],
//               ],
//             },
//           }
//         );
//       });

//       // await ctx.reply(`Yangi mazilingizni nomini kiriting`, {
//       //   parse_mode: "HTML",
//       //   ...Markup.removeKeyboard(),
//       // });
//     }
//   }
