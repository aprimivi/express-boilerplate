import "reflect-metadata";
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
} from "sequelize-typescript";
import { Optional } from "sequelize";

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

export interface UserAttributes {
  id: string;
  name: string;
  email: string;
  password?: string | null;
  refreshToken?: string | null;
  role: UserRole;
  emailVerified?: Date | null;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  image?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreationAttributes = Optional<
  UserAttributes,
  | "id"
  | "password"
  | "refreshToken"
  | "role"
  | "emailVerified"
  | "emailVerificationToken"
  | "emailVerificationExpires"
  | "passwordResetToken"
  | "passwordResetExpires"
  | "image"
  | "createdAt"
  | "updatedAt"
>;

@Table({
  tableName: "user",
  freezeTableName: true,
  timestamps: true,
})
export class User extends Model<UserAttributes, UserCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  declare id: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING(99) })
  declare name: string;

  @AllowNull(false)
  @Unique
  @Column({ type: DataType.STRING(99) })
  declare email: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING(100) })
  declare password: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare refreshToken: string | null;

  @AllowNull(false)
  @Default(UserRole.USER)
  @Column({ type: DataType.ENUM(...Object.values(UserRole)) })
  declare role: UserRole;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare emailVerified: Date | null;

  @AllowNull(true)
  @Column({ type: DataType.STRING(100) })
  declare emailVerificationToken: string | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare emailVerificationExpires: Date | null;

  @AllowNull(true)
  @Column({ type: DataType.STRING(100) })
  declare passwordResetToken: string | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare passwordResetExpires: Date | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare image: string | null;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare updatedAt: Date;
}

export default User;
