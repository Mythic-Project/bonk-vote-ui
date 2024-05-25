'use client'

import { ReactNode, useState } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

export function TanstackProvider({children} : {children: ReactNode}) {
    const [client] = useState(new QueryClient())

    return (
        <QueryClientProvider client={client}>
            {children}
        </QueryClientProvider>
    )
}