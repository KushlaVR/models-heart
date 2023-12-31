﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Threading;
using System.Threading.Tasks;

namespace WebUI.Models
{
    public class WorkSpace
    {

        public readonly Dictionary<string, string> currentValues = new Dictionary<string, string>();
        //private readonly Dictionary<string, string> sendValues = new Dictionary<string, string>();

        // Перелік клієнтів
        private readonly List<Client> Clients = new List<Client>();

        // Флажок для багатопотокових операцій
        readonly ReaderWriterLockSlim Locker = new ReaderWriterLockSlim();

        public WorkSpace()
        {

        }

        internal void AddClient(Client client)
        {
            Locker.EnterWriteLock();
            try
            {
                Clients.Add(client);
                client.ws = this;
            }
            finally
            {
                Locker.ExitWriteLock();
            }
        }

        public async Task<bool> sendAll()
        {
            for (int i = 0; i < Clients.Count; i++)
            {
                Client nextClient = Clients[i];
                await SendOne(nextClient);
            }

            return true;
        }

        public async Task<bool> SendOne(Client client)
        {
            Locker.EnterWriteLock();
            try
            {
                if (!await client.sendAsync(currentValues))
                {
                    Clients.Remove(client);
                };
            }
            finally
            {
                Locker.ExitWriteLock();
            }
            return true;
        }

        public void updateValues(Dictionary<string, string> received)
        {
            Locker.EnterWriteLock();
            try
            {
                foreach (string key in received.Keys)
                {

                    if (currentValues.ContainsKey(key))
                    {
                        currentValues[key] = received[key];
                    }
                    else
                    {
                        currentValues.Add(key, received[key]);
                    }
                }

                if (currentValues.ContainsKey("left"))
                {
                    currentValues["left"] = DateTime.Now.Second.ToString();
                }
                else
                {
                    currentValues.Add("left", DateTime.Now.Second.ToString());
                }

                if (currentValues.ContainsKey("right"))
                {
                    currentValues["right"] = DateTime.Now.Second.ToString();
                }
                else
                {
                    currentValues.Add("right", DateTime.Now.Second.ToString());
                }

            }
            finally
            {
                Locker.ExitWriteLock();
            }
        }

        internal Client ClientByID(string clientID)
        {
            Locker.EnterWriteLock();
            try
            {
                foreach (Client client in Clients)
                {

                    if (client.clientID == clientID)
                    {
                        return client;
                    }
                }
            }
            finally
            {
                Locker.ExitWriteLock();
            }
            return null;
        }
    }
}