import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import HomePage from "./pages/HomePage";
import WallPage from "./pages/WallPage";
import CreateProblemPage from "./pages/CreateProblemPage";
import ProblemDetailPage from "./pages/ProblemDetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "walls/:wallId", element: <WallPage /> },
      { path: "walls/:wallId/create", element: <CreateProblemPage /> },
      { path: "problems/:problemId", element: <ProblemDetailPage /> }
    ]
  }
]);