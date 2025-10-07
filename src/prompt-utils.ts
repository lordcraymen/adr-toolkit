import { createInterface } from 'node:readline';
import process from 'node:process';

export async function promptYesNo(question: string, defaultValue: boolean = false): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const suffix = defaultValue ? ' [Y/n]' : ' [y/N]';
  
  return new Promise((resolve) => {
    rl.question(question + suffix + ': ', (answer) => {
      rl.close();
      
      const normalized = answer.toLowerCase().trim();
      
      if (normalized === '') {
        resolve(defaultValue);
      } else if (normalized === 'y' || normalized === 'yes') {
        resolve(true);
      } else if (normalized === 'n' || normalized === 'no') {
        resolve(false);
      } else {
        // Invalid input, use default
        resolve(defaultValue);
      }
    });
  });
}