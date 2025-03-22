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

    const { code, username } = req.body;

    if (!code || !username) {
        res.status(400).json({ message: 'Code or username is missing' });
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

    await prisma.presenters.deleteMany({
        where: {
            joinedRoomId: room.id,
            username: username
        }
    });

    await prisma.votes.deleteMany({
        where: {
            voter: {
                username: username,
                joinedRoomId: room.id
            }
        }
    });

    await prisma.voters.deleteMany({
        where: {
            username: username,
            joinedRoomId: room.id
        }
    });

    res.status(200).json({ message: 'Vote added' });
}