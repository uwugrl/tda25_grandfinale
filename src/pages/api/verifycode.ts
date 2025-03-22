import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method not allowed' });
        return;
    }

    if (req.headers['content-type'] !== 'application/json') {
        res.status(400).json({ message: 'Content type must be application/json' });
        return;
    }

    const { code } = req.body;

    const record = await prisma.rooms.findFirst({
        where: {
            inviteCode: code,
            state: "starting"
        }
    });

    if (!record) {
        res.status(404).json({ status: 'Invalid code' });
        return;
    }

    res.status(200).json({ status: 'OK' });
}