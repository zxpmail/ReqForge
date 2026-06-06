import { Command } from "commander";

export const helloCommand = new Command("hello")
  .description("Say hello")
  .argument("[name]", "who to greet", "world")
  .action((name: string) => {
    console.log(`Hello, ${name}!`);
    console.log(`This is {{projectName}}.`);
  });
