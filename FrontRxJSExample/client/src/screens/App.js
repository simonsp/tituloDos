import React, { useState, useEffect } from "react";
import "./App.css";
import "antd/dist/antd.css";
import { Table } from "antd";
import useSocket from "../hooks/useSocket";

const columns = [
  {
    title: "Nombre",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Edad",
    dataIndex: "age",
    key: "age",
  },
  {
    title: "Empresa",
    dataIndex: "company",
    key: "company",
  },
];

function App() {
  const [users, setUsers] = useState([]);

  useSocket({
    subscribeEvent: "userPublished",
    subscribeEventHandler: (user) => {
      setUsers((prevUsers) => [...prevUsers, user]);
    },
  });

  return (
    <div width="100%" className="App">
      Usuarios
      <Table dataSource={users} columns={columns} />
    </div>
  );
}

export default App;
