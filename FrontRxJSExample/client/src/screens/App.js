import React, { useState, useEffect } from "react";
import "./App.css";
import "antd/dist/antd.css";
import axios from "axios";
import {
  Table,
  Input,
  Col,
  Row,
  Divider,
  Avatar,
  Typography,
  message,
  Spin,
  Button,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import API from "../utils/api";
import useSocket from "../hooks/useSocket";

const { Title, Text } = Typography;

const headers = {
  "Content-Type": "application/json",
  Authorization: "JWT fefege...",
};

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
  const [name, setName] = useState(``);
  const [age, setAge] = useState(``);
  const [company, setCompany] = useState(``);
  const [loading, setLoading] = useState(false);

  async function register() {
    setLoading(true);
    try {
      await API.post(`/create`, { name, age, company }, { headers: headers });
      setLoading(false);
      message.success(`Usuario registrado exitosamente!.`);
    } catch (error) {
      setLoading(false);
      message.error(`Usuario no registrado`, error);
    }
  }

  useSocket({
    subscribeEvent: "userPublished",
    subscribeEventHandler: (user) => {
      setUsers((prevUsers) => [...prevUsers, user]);
    },
  });
  return (
    <>
      <Row
        justify="center"
        style={{
          backgroundColor: "#ABCDEF",
          paddingTop: "30px",
          paddingBottom: "30px",
        }}
      >
        <Title>Arquitectura Reactiva App - UTEM 2020</Title>
      </Row>
      <Divider
        orientation="left"
        style={{ color: "#333", fontWeight: "normal" }}
      >
        <Avatar
          icon={<UserOutlined />}
          style={{ backgroundColor: "##ABCDEF", marginRight: "10px" }}
        />
        <Text>Registro de usuarios</Text>
      </Divider>
      <Row justify="center">
        <Col span={12}>
          Ingrese su nombre
          <Input
            width="50%"
            value={name}
            placeholder="Ingrese nombre"
            onChange={(e) => setName(e.target.value)}
          />
          Ingrese su edad
          <Input
            width="50%"
            placeholder="Ingrese edad"
            onChange={(e) => setAge(e.target.value)}
          />
          Ingrese el nombdre de empresa
          <Input
            width="50%"
            placeholder="Ingrese empresa"
            onChange={(e) => setCompany(e.target.value)}
          />
          <Button type="primary" onClick={() => register()} disabled={loading}>
            {loading ? <Spin /> : `Registrarme`}
          </Button>
        </Col>
      </Row>
      <Divider
        orientation="left"
        style={{ color: "#333", fontWeight: "normal" }}
      >
        Usuarios registrados
      </Divider>
      <Row justify="center">
        <Col span={20}>
          <Table dataSource={users} columns={columns} />
        </Col>
      </Row>
    </>
  );
}

export default App;
