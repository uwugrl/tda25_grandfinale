import { PrismaClient } from "@prisma/client";
import { formatDistanceStrict, formatDistanceToNow, formatDuration, intervalToDuration, sub } from "date-fns";
import { formatDurationWithOptions } from "date-fns/fp";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();


async function getBestPresenters() {
    const bestPresenters = await prisma.presenters.findMany({
        include: {
        Votes: true,
        },
    });

    const rankedPresenters = bestPresenters.map((presenter) => {
        const totalVotes = presenter.Votes.length || 1;
        return {
        id: presenter.id,
        username: presenter.username,
        idea: presenter.idea,
        prinosnost: presenter.Votes.reduce((acc, v) => acc + v.prinosnost, 0) / totalVotes,
        kreativita: presenter.Votes.reduce((acc, v) => acc + v.kreativita, 0) / totalVotes,
        uskutecnost: presenter.Votes.reduce((acc, v) => acc + v.uskutecnost, 0) / totalVotes,
        };
    });

    return {
        bestByPrinosnost: [...rankedPresenters].sort((a, b) => b.prinosnost - a.prinosnost),
        bestByKreativita: [...rankedPresenters].sort((a, b) => b.kreativita - a.kreativita),
        bestByUskutecnost: [...rankedPresenters].sort((a, b) => b.uskutecnost - a.uskutecnost),
    };
}

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
        res.status(400).json({ notFound: true });
        return;
    }

    const room = await prisma.rooms.findFirst({
        where: {
            inviteCode: code
        }
    });

    if (!room) {
        res.status(404).json({ notFound: true });
        return;
    }

    if (room.state !== "running") {
        res.status(200).json({ waitingForRoomStart: true });
        return;
    }

    const presenter = await prisma.presenters.findFirst({
        where: {
            joinedRoomId: room.id,
            OR: [
                {votingState: 1},
                {presenting: true}
            ]
        }
    });

    if (!presenter) {

        const results = await getBestPresenters();

        res.status(200).json({ 
            finished: true,
            prinosnost: {
                username: results.bestByPrinosnost[0].username,
                idea: results.bestByPrinosnost[0].idea,
                prinosnost: results.bestByPrinosnost[0].prinosnost
            },
            kreativita: {
                username: results.bestByKreativita[0].username,
                idea: results.bestByKreativita[0].idea,
                kreativita: results.bestByKreativita[0].kreativita
            },
            uskutecnost: {
                username: results.bestByUskutecnost[0].username,
                idea: results.bestByUskutecnost[0].idea,
                uskutecnost: results.bestByUskutecnost[0].uskutecnost
            }
        });
        return;
    }

    if (room.paused) {
        res.status(200).json({ paused: true });
        return;
    }

    const voted = await prisma.votes.findFirst({
        where: {
            presenterId: presenter.id,
            voter: {
                username
            }
        }
    });

    const duration = intervalToDuration({ start: presenter.presentationStart!, end: new Date() });

    res.status(200).json({ voting: true, current: {
        presenting: presenter.username === username,
        presentingUsername: room.paused ? null : presenter.username,
        votingBegan: presenter.votingState === 1,
        presentingFinished: !presenter.presenting,
        voted: !!voted,
        duration: `${(duration.minutes ?? 0).toString().padStart(2, '0')}:${(duration.seconds ?? 0).toString().padStart(2, '0')}` 
    }});
}