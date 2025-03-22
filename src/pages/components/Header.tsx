/*
 * Think different Academy je aplikace umožnující hrát piškvorky.
 * Copyright (C) 2024-2025 mldchan
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import Image from "next/image";

import tda from '../Logo2.png';
import localFont from "next/font/local";
import React from "react";

const dosis = localFont({ src: '../../pages/fonts/Dosis.ttf' });


export default function Header() {
    return <div className={`${dosis.className} fixed flex flex-row justify-center gap-6 w-5/6 left-1/2 top-4 bg-[#f6f6f6ee] -translate-x-1/2 p-3 px-3 rounded-xl drop-shadow-xl h-24`}>
        <Image src={tda} alt={'Think different Academy logo'} className="cursor-pointer m-1" width={193} height={144} />
    </div>
}
