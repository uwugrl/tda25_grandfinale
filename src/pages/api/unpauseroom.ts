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

    const { id } = req.body;

    if (!id) {
        res.status(400).json({ message: 'Code is required' });
        return;
    }

    if (isNaN(Number(id))) {
        res.status(400).json({ message: 'Code is not a number' });
        return;
    }

    const room = await prisma.rooms.findFirst({
        where: {
            id: Number(id)
        }
    });

    if (!room) {
        res.status(404).json({ message: 'Room not found' });
        return;
    }

    await prisma.rooms.update({
        where: {
            id: room.id
        },
        data: {
            paused: false
        }
    });

    await prisma.presenters.updateMany({
        where: {
            votingState: 1
        },
        data: {
            votingState: 2
        }
    });

    const presenters = await prisma.presenters.findMany({
        where: {
            presented: false,
            joinedRoom: {
                inviteCode: room.inviteCode
            }
        }
    });

    const random = Math.floor(Math.random() * presenters.length);

    await prisma.presenters.update({
        where: {
            id: presenters[random].id
        },
        data: {
            presenting: true
        }
    });

    res.status(200).json({ message: 'Room unpaused' });
}
