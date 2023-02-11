FROM node:18

WORKDIR /usr/src/executor

COPY runner /bin/runner
RUN chmod +x /bin/runner
COPY ./ /usr/src/executor

EXPOSE 8080
CMD [ "/bin/runner", "tail -f /dev/null" ]
# CMD [ "tail", "-f", "/dev/null" ]


