#!/usr/bin/env node
import { Command } from "commander";
import { helloCommand } from "./commands/hello.js";

const program = new Command();

program
  .name("{{projectName}}")
  .description("CLI tool scaffolded with Forge")
  .version("0.1.0");

program.addCommand(helloCommand);

program.parse(process.argv);
