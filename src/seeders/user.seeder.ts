import bcrypt from "bcrypt";
import { User, UserRole } from "@/models/user.model";

export async function seedUsers() {
    await User.destroy({ where: {}, truncate: true, cascade: true });

    const hashedPassword = await bcrypt.hash("Password123!", 10);

    const users = [
        {
            name: "John Doe",
            email: "john@example.com",
            password: hashedPassword,
            role: UserRole.ADMIN,
        },
        {
            name: "Jane Smith",
            email: "jane@example.com",
            password: hashedPassword,
        },
        {
            name: "Bob Johnson",
            email: "bob@example.com",
            password: hashedPassword,
        },
    ];

    for (const user of users) {
        await User.create(user);
    }
}