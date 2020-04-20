class Message:
    '''The class to represent a Message'''
    def __init__(self, msg_id, usr, msg, timest):
        '''Give uuid, username, message and timestamp'''
        self.msg_id = msg_id
        self.usr = usr
        self.msg = msg
        self.timest = timest