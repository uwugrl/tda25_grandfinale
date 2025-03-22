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


    const { code, username, idea } = req.body;

    if (!code || !username || !idea) {
        res.status(400).json({ message: 'Code and idea are required' });
        return;
    }

    const room = await prisma.rooms.findFirst({
        where: {
            inviteCode: code
        }
    });

    if (!room) {
        res.status(404).json({ message: 'Room not found' });
        return;
    }

    await prisma.presenters.create({
        data: {
            joinedRoomId: room.id,
            username,
            idea: idea
        }
    });

    await prisma.voters.create({
        data: {
            username: username,
            joinedRoomId: room.id
        }
    })

    res.status(200).json({ message: 'Presenter added' });
}