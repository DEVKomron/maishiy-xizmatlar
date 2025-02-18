import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IStuffCreationAttr {
  stuff_id: number | undefined;
  name: string | undefined;
  address: string | undefined;
  start_work_time: string | undefined;
  end_work_time: string | undefined;
  spend_time: string | undefined;
  last_state: string | undefined;
  phone_number: string | undefined;
  service_type: string | undefined;
  place_name: string | undefined;
  rating: string | undefined;
  rating_count: string | undefined;
}

@Table({ tableName: "stuff" })
export class Stuff extends Model<Stuff, IStuffCreationAttr> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
  })
  stuff_id: number | undefined;

  @Column({
    type: DataType.STRING,
  })
  name: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  place_name: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  service_type: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  address: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  location: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  phone_number: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  orient: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  start_work_time: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  end_work_time: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  spend_time: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  rating: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  rating_count: string | undefined;

  @Column({
    type: DataType.BOOLEAN,
  })
  status: boolean | undefined;

  @Column({
    type: DataType.STRING,
  })
  last_state: string | undefined;
}
