CS421 Graduate Project - Prove tree practice user interface on UIUC PrairieLearn
===

1.Installing and running PrairieLearn - Docker with built-in PrairieLearn
---
Step 1: Clone the "exampleCourse" repository.

Step 2: Install [Docker Community Edition](https://www.docker.com/community-edition). It's free.
On Linux and MacOS this is straightforward. [Download from here](https://store.docker.com/search?type=edition&offering=community).
On Windows the best version is [Docker Community Edition for Windows](https://store.docker.com/editions/community/docker-ce-desktop-windows), which requires Windows 10 Pro/Edu. You should install this if at all possible because it is much better than the older "Docker Toolbox".
UIUC students and staff can download Windows 10 from the WebStore.

Step 3: Run PrairieLearn using your own example course, point Docker to the correct exampleCourse directory (replace the precise path with your own) on Windows:
```
docker run -it --rm -p 3000:3000 -v C:\GitHub\exampleCourse:/course prairielearn/prairielearn
```
or on MacOS/Linux such as:
```
docker run -it --rm -p 3000:3000 -v /Users/vincent.k.z/Documents/exampleCourse:/course prairielearn/prairielearn
```
If you are using Docker for Windows then you will need to first give Docker permission to access the C: drive (or whichever drive your course directory is on). This can be done by right-clicking on the Docker "whale" icon in the taskbar, choosing "Settings", and granting shared access to the C: drive.
If you're in the root of your course directory already, you can substitute %cd% (on Windows) or $PWD (Linux and MacOS) for /path/to/course.

2.Running the practice system
---
Step 1: After PrairieLearn is running, click "Load From Disk" in the upperright corner of the website.
<img width="1267" alt="screen shot 2017-08-07 at 5 00 33 pm" src="https://media.github-dev.cs.illinois.edu/user/50/files/0f67457a-7b92-11e7-8ac6-5d4ca4c6ed7f">
Step 2: After the successful loading, go to the panel with the title "Course instances" and go to the example course instance "TPL 101: Example Course - For Big step Semantics, Spring 2015"

Step 3: Choose the panel with title "Homework 2" and pick "Demo for Big Step Semantics prove tree", then choose the question "Big Step Semantics: 01"

Step 4: Click, expand and fill the tree node of the decision tree. Click save button every time you want to inspect what you change with the prove tree.
<img width="1143" alt="screen shot 2017-08-07 at 5 03 24 pm" src="https://media.github-dev.cs.illinois.edu/user/50/files/64756092-7b92-11e7-9d65-0979facd9c73">
<img width="1112" alt="screen shot 2017-08-07 at 5 03 34 pm" src="https://media.github-dev.cs.illinois.edu/user/50/files/72172ed8-7b92-11e7-9a59-88b13eeaa8c2">

Author
---
Keye Zhang(keyez2)  
Xiaolan Ke(xiaolan2)
