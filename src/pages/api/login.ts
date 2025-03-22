import { addDays } from "date-fns";
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method not allowed' });
        return;
    }

    if (req.headers['content-type'] !== 'application/json') {
        res.status(400).json({ message: 'Content type must be application/json' });
        return;
    }

    const { password } = req.body;

    if (!password) {
        res.status(400).json({ message: 'Password is required' });
        return;
    }

    if (password !== 'Think_diff3r3nt_Admin') {
        res.status(401).json({ message: 'Wrong password' });
        return;
    }

    let expiryDate = addDays(new Date(), 28);
    res.setHeader('Set-Cookie', `adminToken=${password};path=/;expires=${expiryDate.toUTCString()}`);

    res.status(200).json({ message: 'Logged in' });
}