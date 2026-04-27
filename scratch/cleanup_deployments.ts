import { execSync } from 'child_process';

async function cleanupDeployments() {
  try {
    console.log('Listing deployments...');
    const output = execSync('npx -y @insforge/cli deployments list').toString();
    const lines = output.split('\n');
    
    // The list command seems to output a table. 
    // We need to parse the IDs and Statuses.
    // Example line: │ 1bcd5bab-c2e3-48b1-a58b-5a6516da8a2c │ READY │ ...
    
    const idsToCancel = [];
    for (const line of lines) {
      if (line.includes('|') || line.includes('│')) {
        const parts = line.split(/[|│]/).map(p => p.trim());
        if (parts.length >= 3) {
          const id = parts[1];
          const status = parts[2];
          
          if (id && status === 'UPLOADING') {
            idsToCancel.push(id);
          }
        }
      }
    }
    
    console.log(`Found ${idsToCancel.length} deployments to cancel.`);
    
    for (const id of idsToCancel) {
      try {
        console.log(`Cancelling deployment ${id}...`);
        execSync(`npx -y @insforge/cli deployments cancel ${id}`);
        console.log(`Successfully cancelled ${id}`);
      } catch (err) {
        console.error(`Failed to cancel ${id}:`, err.message);
      }
    }
    
    console.log('Cleanup finished.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanupDeployments();
