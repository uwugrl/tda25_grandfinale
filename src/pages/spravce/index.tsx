import { Button, Input, Modal, ModalClose, ModalDialog, Table, Typography } from "@mui/joy";
import { PrismaClient } from "@prisma/client";
import { captureException } from "@sentry/nextjs";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { stat } from "node:fs/promises";
import React from "react";

const prisma = new PrismaClient();

function stateToReadable(state: string) {
    switch (state) {
        case "starting":
            return "Připojování";
        case "running":
            return "Probíhá";
        case "finished":
            return "Dokončeno";
        default:
            return "Neznámý";
    }
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
    const {adminToken} = ctx.req.cookies;
    
    if (!adminToken) {
        return {
            redirect: {
                destination: '/login',
                permanent: false
            }
        }
    }

    if (adminToken !== 'Think_diff3r3nt_Admin') {
        ctx.res.setHeader('Set-Cookie', `adminToken=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`);
        return {
            redirect: {
                destination: '/login',
                permanent: false
            }
        }
    }
    
    const rooms = await prisma.rooms.findMany();



    return {
        props: {
            rooms: rooms.map(x => ({
                id: x.id,
                name: x.name,
                state: stateToReadable(x.state),
                code: x.inviteCode
            }))
        }
    }
}

export default function Spravce(props: InferGetServerSidePropsType<typeof getServerSideProps>) {

    const [openCreateRoom, setOpenCreateRoom] = React.useState(false);
    const [creatingRoom, setCreatingRoom] = React.useState(false);

    const [rooms, setRooms] = React.useState(props.rooms);

    const [roomName, setRoomName] = React.useState("");

    const createTheRoom = () => {
        setCreatingRoom(true);
        fetch('/api/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: roomName
            })
        }).then(x => {
            if (x.ok) {
                x.json().then(y => {
                    setCreatingRoom(false);
                    setOpenCreateRoom(false);
                    setRoomName("");
                    setRooms(rooms.concat({
                        id: y.id,
                        name: roomName,
                        state: "Připojování",
                        code: y.code
                    }))
                }).catch(x => {
                    captureException(x);
                });
            }
        }).catch(x => {
            setCreatingRoom(false);
            captureException(x);
        });
    }

    const navigateToRoom = (id: number) => {
        location.href = `/spravce/${id}`;
    }

    return (
        <div className="w-2/3 m-auto">
            <Typography level="h1">Správce</Typography>
            <Button onClick={() => setOpenCreateRoom(true)}>Založit roomku</Button>

            <Table>
                <thead>
                    <tr>
                        <th>Název</th>
                        <th>Kód</th>
                        <th>Stav</th>
                    </tr>
                </thead>
                <tbody>
                    {rooms.map(x => (
                        <tr key={x.id}>
                            <td>
                                <Typography onClick={() => navigateToRoom(x.id)}>{x.name}</Typography>
                            </td>
                            <td>
                                <Typography>{x.code}</Typography>
                            </td>
                            <td>
                                <Typography>Probíhá</Typography>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal open={openCreateRoom} onClose={() => setOpenCreateRoom(false)}>
                <ModalDialog>
                    <ModalClose />
                    <Typography level="h1">Vytvořit roomku</Typography>
                    <Typography>Název</Typography>
                    <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} disabled={creatingRoom} />
                    
                    <Button onClick={createTheRoom} disabled={creatingRoom}>Vytvořit</Button>
                </ModalDialog>
            </Modal>
        </div>
    )
}