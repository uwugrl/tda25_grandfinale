import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

function generateCode() {
    // 6 digits, 1-9

    const possible = "123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return code;
}

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

    if (req.method === 'POST') {
        const { name, planDate } = req.body;

        const planDateParsed = new Date(planDate);

        if (isNaN(planDateParsed.getTime())) {
            res.status(400).json({ message: 'Invalid date' });
            return;
        }

        const record = await prisma.rooms.create({
            data: {
                name: name,
                inviteCode: generateCode(),
                paused: false,
                planDate: planDateParsed
            }
        });
        res.status(200).json({ message: 'Room created', id: record.id, code: record.inviteCode });
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}