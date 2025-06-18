// External npm packages
import { Twilio } from 'twilio';
import dotenv from 'dotenv';
import { WorkspaceInstance } from 'twilio/lib/rest/taskrouter/v1/workspace';
import { TaskQueueInstance } from 'twilio/lib/rest/taskrouter/v1/workspace/taskQueue';
import { WorkflowInstance } from 'twilio/lib/rest/taskrouter/v1/workspace/workflow';

// Local imports
import { log } from '../../../src/lib/utils/logger';
import { updateEnvFile } from '../helpers/updateEnvFile';

export async function createTaskRouterService(client: Twilio): Promise<{
  workspace: WorkspaceInstance;
  taskQueue: TaskQueueInstance;
  workflow: WorkflowInstance;
}> {
  dotenv.config();
  const serviceName = process.env.SERVICE_NAME;

  try {
    // Step 1: Check if a workspace already exists
    const workspaceName = `${serviceName} TaskRouter Workspace`;
    let workSpace: WorkspaceInstance | null = null;
    const workspaces = await client.taskrouter.v1.workspaces.list({ limit: 1 });

    if (workspaces.length > 0) {
      workSpace = workspaces[0];
      log.info(`Existing workspace found: ${workSpace.sid}`);
    } else {
      // Create a new TaskRouter Workspace if none exists
      workSpace = await client.taskrouter.v1.workspaces.create({
        friendlyName: workspaceName,
      });
      log.green(`New workspace created: ${workSpace.sid}`);
    }

    // Step 2: Check if a Task Queue with the same name already exists
    const taskQueueName = `${serviceName} Task Queue`;
    let taskQueue: TaskQueueInstance | null = null;
    const taskQueues = await client.taskrouter.v1
      .workspaces(workSpace.sid)
      .taskQueues.list();

    if (taskQueues.length > 0) {
      // If a queue exists with the exact name, use it
      taskQueue = taskQueues.find(
        (queue) => queue.friendlyName === taskQueueName
      )!;
      if (taskQueue) {
        log.info(`Existing Task Queue found: ${taskQueue.sid}`);
      }
    }
    // If no task queue with the name exists, create a new one
    if (!taskQueue) {
      taskQueue = await client.taskrouter.v1
        .workspaces(workSpace.sid)
        .taskQueues.create({
          friendlyName: taskQueueName,
          reservationActivitySid: workSpace.defaultActivitySid,
          assignmentActivitySid: workSpace.defaultActivitySid,
        });
      log.green(`New Task Queue created: ${taskQueue.sid}`);
    }

    // Step 3: Check if a Workflow with the same name already exists
    const workflowName = `${serviceName} Workflow`;
    let workflow: WorkflowInstance | null = null;
    const workflows = await client.taskrouter.v1
      .workspaces(workSpace.sid)
      .workflows.list();

    if (workflows.length > 0) {
      // If a workflow exists with the exact name, use it
      workflow = workflows.find((wf) => wf.friendlyName === workflowName)!;
      if (workflow) {
        log.info(`Existing Workflow found: ${workflow.sid}`);
      }
    }
    if (!workflow) {
      // If no workflow with the name exists, create a new one
      workflow = await client.taskrouter.v1
        .workspaces(workSpace.sid)
        .workflows.create({
          friendlyName: workflowName,
          configuration: JSON.stringify({
            task_routing: {
              filters: [],
              default_filter: {
                queue: taskQueue.sid, // Assigns tasks to the created queue
              },
            },
          }),
        });
      log.green(`New Workflow created: ${workflow.sid}`);
    }

    // Save Workflow SID to .env
    await updateEnvFile('TWILIO_WORKFLOW_SID', workflow.sid);

    return { workspace: workSpace, taskQueue, workflow };
  } catch (error) {
    log.error('Error creating TaskRouter service:', error);
    throw error;
  }
}
