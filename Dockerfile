FROM mhart/alpine-node
ADD . /project
WORKDIR /project
RUN npm install
CMD npm start
