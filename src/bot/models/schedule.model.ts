import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IScheduleCreationAttr {
  stuff_id: number | undefined;
  day: string | undefined;
  time: string | undefined;
  is_busy: boolean | undefined;
  client_id: string | undefined;
  last_state:string|undefined
}

@Table({ tableName: "schedule" })
export class Schedule extends Model<Schedule, IScheduleCreationAttr> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number | undefined;

  @Column({
    type: DataType.STRING,
  })
  stuff_id: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  client_id: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  day: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  time: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  last_state: string | undefined;

  @Column({
    type: DataType.BOOLEAN,
  })
  is_busy: boolean | undefined;
}