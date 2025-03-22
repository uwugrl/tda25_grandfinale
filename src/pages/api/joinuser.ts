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

    const room = await prisma.rooms.findFirst({
        where: {
            inviteCode: req.body.code
        }
    });

    if (!room) {
        res.status(404).json({ message: 'Room not found' });
        return;
    }

    const user = await prisma.voters.create({
        data: {
            username: req.body.username,
            joinedRoomId: room.id
        }
    });

    res.status(200).json({ message: 'User joined room', user: user });
}