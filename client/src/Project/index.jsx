import React from 'react';
import { Route, Redirect, useRouteMatch, useHistory } from 'react-router-dom';

import useApi from 'shared/hooks/api';
import { updateArrayItemById } from 'shared/utils/javascript';
import { createQueryParamModalHelpers } from 'shared/utils/queryParamModal';
import { PageLoader, PageError, Modal } from 'shared/components';
import { ActionButton } from 'Project/ProjectSettings/Styles';
import toast from 'shared/utils/toast';

import NavbarLeft from './NavbarLeft';
import Sidebar from './Sidebar';
import Board from './Board';
import IssueSearch from './IssueSearch';
import IssueCreate from './IssueCreate';
import ProjectSettings from './ProjectSettings';
import { ProjectPage } from './Styles';

const Project = () => {
  const match = useRouteMatch();
  const history = useHistory();

  const issueSearchModalHelpers = createQueryParamModalHelpers('issue-search');
  const issueCreateModalHelpers = createQueryParamModalHelpers('issue-create');

  const [{ data, error, setLocalData }, fetchProject] = useApi.get('/project');
  const [_, createProject] = useApi.post('/project')

  if (!data) return <PageLoader />;
  if (error) return <PageError />;

  const { project } = data;

  const updateLocalProjectIssues = (issueId, updatedFields) => {
    console.log(updatedFields, 'updatedFields')
    setLocalData(currentData => ({
      project: {
        ...currentData.project,
        issues: updateArrayItemById(currentData.project.issues, issueId, updatedFields),
      },
    }));
  };

  const getProjectBoard = () => {
    return (
      <React.Fragment>
        <Sidebar project={project} />

        {issueSearchModalHelpers.isOpen() && (
          <Modal
            isOpen
            testid="modal:issue-search"
            variant="aside"
            width={600}
            onClose={issueSearchModalHelpers.close}
            renderContent={() => <IssueSearch project={project} />}
          />
        )}

        {issueCreateModalHelpers.isOpen() && (
          <Modal
            isOpen
            testid="modal:issue-create"
            width={800}
            withCloseIcon={false}
            onClose={issueCreateModalHelpers.close}
            renderContent={modal => (
              <IssueCreate
                project={project}
                fetchProject={fetchProject}
                onCreate={() => history.push(`${match.url}/board`)}
                modalClose={modal.close}
              />
            )}
          />
        )}

        <Route
          path={`${match.path}/board`}
          render={() => (
            <Board
              project={project}
              fetchProject={fetchProject}
              updateLocalProjectIssues={updateLocalProjectIssues}
            />
          )}
        />

        <Route
          path={`${match.path}/settings`}
          render={() => <ProjectSettings project={project} fetchProject={fetchProject} />}
        />
      </React.Fragment>
    )
  }

  return (
    <ProjectPage>
      <NavbarLeft
        issueSearchModalOpen={issueSearchModalHelpers.open}
        issueCreateModalOpen={issueCreateModalHelpers.open}
      />

      {!project ? (
        <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
          <p>no project created yet</p>
          <ActionButton onClick={async () => {
            try {
              await createProject();
              fetchProject();
            } catch (errorCatch) {
              toast.error(errorCatch.message);
            }
          }} variant="primary">Create Project</ActionButton>
        </div>
      ) : getProjectBoard()}

      {match.isExact && <Redirect to={`${match.url}/board`} />}
    </ProjectPage>
  );
};

export default Project;
