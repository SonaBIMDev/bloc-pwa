import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import HomePage from "./pages/HomePage";
import WallPage from "./pages/WallPage";
import CreateProblemPage from "./pages/CreateProblemPage";
import ProblemDetailPage from "./pages/ProblemDetailPage";
import CreateWallPage from "./pages/CreateWallPage";
import EditWallPage from "./pages/EditWallPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "walls/create", element: <CreateWallPage /> },
      { path: "walls/:wallId/edit", element: <EditWallPage /> },
      { path: "walls/:wallId", element: <WallPage /> },
      { path: "walls/:wallId/create", element: <CreateProblemPage /> },
      { path: "problems/:problemId", element: <ProblemDetailPage /> }
    ]
  }
]);