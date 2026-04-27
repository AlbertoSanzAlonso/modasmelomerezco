const { execSync } = require('child_process');

function cleanupDeployments() {
  try {
    console.log('Listing deployments...');
    const output = execSync('npx -y @insforge/cli deployments list').toString();
    const lines = output.split('\n');
    
    const idsToCancel = [];
    for (const line of lines) {
      if (line.includes('|') || line.includes('│')) {
        const parts = line.split(/[|│]/).map(p => p.trim());
        if (parts.length >= 3) {
          const id = parts[1];
          const status = parts[2];
          
          // Only cancel if it's UPLOADING and NOT the header
          if (id && id !== 'Deployment ID' && status === 'UPLOADING') {
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
        console.error(`Failed to cancel ${id}`);
      }
    }
    
    console.log('Cleanup finished.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanupDeployments();
