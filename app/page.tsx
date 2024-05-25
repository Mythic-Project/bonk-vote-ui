'use client'

import DaoUi from "./[dao]/access";
import ErrorPage from "./ui/404";
import { useDaoMeta } from "./providers/dao-provider";

export default function Home() {
  const daoMeta = useDaoMeta()

  return (
    daoMeta ?
        <DaoUi /> :
        <ErrorPage error="The given DAO does not exist" />
  )
}
