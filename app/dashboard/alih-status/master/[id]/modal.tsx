"use client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Modal,
    Button,
    Input,
    toast,
    TextField,
    Label,
    ErrorMessage,
} from "@heroui/react";
import { AlihStatusDataContract } from "@/action/alih-status/data/contract";
import { actionEditAlihStatusData } from "@/action/alih-status/data/action.update";
import { actionCreateAlihStatusData } from "@/action/alih-status/data/action.create";

