import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { RoleEntity } from "./role.entity";
import { OrderEntity } from "./order.entity";

@Entity('users')
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column()
    passwordHash: string;

    @Column({ nullable: true })
    phone: string;

    @ManyToOne(() => RoleEntity, { eager: true })
    @JoinColumn({ name: 'roleId' })
    role: RoleEntity;

    @OneToMany(() => OrderEntity, order => order.createdBy)
    orders: OrderEntity[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}