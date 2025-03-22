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

    const { code, username, prinosnost, kreativita, uskutecnost } = req.body;

    if (!code || !username || !prinosnost || !kreativita || !uskutecnost) {
        res.status(400).json({ message: 'Code, username, prinosnost, kreativita and uskutecnost are required' });
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

    const presenter = await prisma.presenters.findFirst({
        where: {
            joinedRoomId: room.id,
            votingState: 1
        }
    });

    if (!presenter) {
        res.status(404).json({ message: 'Presenter not found' });
        return;
    }

    const voter = await prisma.voters.findFirst({
        where: {
            username: username,
            joinedRoomId: room.id
        }
    });

    if (!voter) {
        res.status(404).json({ message: 'Voter not found' });
        return;
    }
    
    await prisma.votes.create({
        data: {
            presenterId: presenter.id,
            voterId: voter.id,
            prinosnost: prinosnost,
            kreativita: kreativita,
            uskutecnost: uskutecnost
        }
    })

    res.status(200).json({ message: 'Vote added' });
}