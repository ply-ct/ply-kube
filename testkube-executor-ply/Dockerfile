FROM node:18

WORKDIR /usr/src/executor
COPY runner /bin/runner
RUN chmod +x /bin/runner
COPY ./ /usr/src/executor

CMD [ "/bin/runner" ]


