// import {
//   Action,
//   Command,
//   Ctx,
//   Hears,
//   On,
//   Start,
//   Update,
// } from "nestjs-telegraf";
// import { Context } from "telegraf";



// @Update()
// export class CarUpdate {
//   constructor(private readonly carService: CarsService) {}

//   @Command("cars")
//   async onCars(@Ctx() ctx: Context) {
//     await this.carService.onCar(ctx);
//   }
//   @Hears("Yangi avto qo'shish")
//   async onCommandNewCar(@Ctx() ctx: Context) {
//     await this.carService.onCommandNewCar(ctx);
//   }

//   @Hears("Mening avtomobillarim")
//   async onCommandMyCars(@Ctx() ctx: Context) {
//     await this.carService.onCommandMyCars(ctx);
//   }

//   // @Action(/^loc_+\d+/)
//   // async onClickLocation(@Ctx() ctx: Context) {
//   //   await this.addressService.onClickLocation(ctx);
//   // }
// }
