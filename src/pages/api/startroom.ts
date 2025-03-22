import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {adminToken} = req.cookies;

    if (!adminToken) {
        res.status(401).json({ message: 'Admin token is required' });
        return;
    }

    if (adminToken !== 'Think_diff3r3nt_Admin') {
        res.status(401).json({ message: 'Wrong admin token' });
        return;
    }

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
            state: "running"
        }
    })

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

    res.status(200).json({ message: 'Room started' });
}