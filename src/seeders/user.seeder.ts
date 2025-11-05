import { PrismaClient, user_role } from "@prisma/client";
import bcrypt from "bcrypt";

export async function seedUsers(prisma: PrismaClient) {
    // Clear existing data
    await prisma.user.deleteMany({});

    // Create development test users
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    const users = [
        {
            name: "John Doe",
            email: "john@example.com",
            password: hashedPassword,
            role: user_role.ADMIN,
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
        await prisma.user.create({ data: user });
    }
}